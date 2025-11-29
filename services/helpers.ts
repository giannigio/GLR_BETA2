
import { Job, JobStatus, InventoryItem, CrewMember, CrewTask } from '../types';

export interface AvailabilityResult {
  available: number;
  conflicts: { jobName: string; quantity: number }[];
}

export const checkAvailabilityHelper = (
    inventory: InventoryItem[], 
    jobs: Job[],
    inventoryId: string, 
    startDate: string, 
    endDate: string, 
    currentJobId?: string
): AvailabilityResult => {
  const item = inventory.find(i => i.id === inventoryId);
  if (!item) return { available: 0, conflicts: [] };

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  let used = 0;
  const conflicts: { jobName: string; quantity: number }[] = [];

  jobs.forEach(job => {
    if (job.status === JobStatus.CANCELLED || job.id === currentJobId) return;
    
    const jobStart = new Date(job.startDate).getTime();
    const jobEnd = new Date(job.endDate).getTime();

    if (start <= jobEnd && end >= jobStart) {
      const mat = job.materialList.find(m => m.inventoryId === inventoryId);
      if (mat) {
        used += mat.quantity;
        conflicts.push({ jobName: job.title, quantity: mat.quantity });
      }
    }
  });

  return {
    available: Math.max(0, item.quantityOwned - used),
    conflicts
  };
};

// --- NEW 5+2 REST LOGIC CALCULATOR ---
// Rule: Every technician has 5 working days + 2 rest days per week.
// If worked > 5, accumulate missed rest.
// Missed rest must be recovered in the month or paid as overtime.

export const calculateMissedRestDaysHelper = (
    jobs: Job[], 
    crewId: string, 
    year: number, 
    month: number,
    tasks: CrewTask[] = [],
    absences: any[] = [] // CrewAbsence
) => {
    // Helper to get Week Number of the year (ISO 8601)
    const getWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    };

    const daysWorkedByWeek: Record<number, number> = {};
    const totalDaysWorked = new Set<string>();
    const totalRestDays = new Set<string>();
    
    // 1. Identify Worked Days based on Jobs
    jobs.forEach(job => {
        if (!job.assignedCrew.includes(crewId) || job.status === JobStatus.CANCELLED) return;
        
        let d = new Date(job.startDate);
        const end = new Date(job.endDate);
        
        while (d <= end) {
            // Check if date is in the requested month (or relevant context)
            if (d.getFullYear() === year && d.getMonth() === month) {
                const dayStr = d.toISOString().split('T')[0];
                totalDaysWorked.add(dayStr);
                
                const weekNum = getWeek(d);
                daysWorkedByWeek[weekNum] = (daysWorkedByWeek[weekNum] || 0) + 1;
            }
            d.setDate(d.getDate() + 1);
        }
    });

    // 2. Identify Manual Task Days
    tasks.forEach(task => {
        const d = new Date(task.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const dayStr = task.date;
            if (!totalDaysWorked.has(dayStr)) {
                totalDaysWorked.add(dayStr);
                const weekNum = getWeek(d);
                daysWorkedByWeek[weekNum] = (daysWorkedByWeek[weekNum] || 0) + 1;
            }
        }
    });

    // 3. Identify Default Working Days (Mon-Fri) if not on Leave or Rest
    // Iterate through all days of the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dayStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay(); // 0 Sun, 6 Sat
        const weekNum = getWeek(d);

        // Check Absences (Leave/Sick) - These reduce working days count requirement or count as rest depending on policy.
        // For simplicity: Leave/Sick/Permesso overrides everything.
        const isAbsent = absences.some(a => dayStr >= a.startDate && dayStr <= a.endDate);
        
        if (isAbsent) {
            // Count as neutral or Rest? Let's assume neutral for 5+2 calculation, 
            // but effectively they are not "worked" days.
            continue;
        }

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isAlreadyWorked = totalDaysWorked.has(dayStr);

        if (!isAlreadyWorked) {
            if (!isWeekend) {
                // Default Warehouse Day (Work)
                // In a strict system, this adds to "Worked Days".
                // However, usually 5+2 applies to *active* production work.
                // Assuming "Magazzino" is work:
                totalDaysWorked.add(dayStr);
                daysWorkedByWeek[weekNum] = (daysWorkedByWeek[weekNum] || 0) + 1;
            } else {
                // Default Rest Day
                totalRestDays.add(dayStr);
            }
        }
    }

    let missedRestDays = 0;
    // Calculate overflow per week
    Object.values(daysWorkedByWeek).forEach(days => {
        if (days > 5) {
            missedRestDays += (days - 5);
        }
    });
    
    // Check if missed rest was recovered (e.g. explicitly marked Rest days on Mon-Fri?)
    // For this MVP, we simplify: missedRestDays is simply the accumulation of >5 days weeks.
    // In a full system, you'd scan for "Recupero Riposo" status.

    return {
        totalWorked: totalDaysWorked.size,
        missedRest: missedRestDays,
        daysWorkedByWeek
    };
};