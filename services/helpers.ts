import { Job, JobStatus, InventoryItem } from '../types';

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

export const calculateMissedRestDaysHelper = (jobs: Job[], crewId: string, year: number, month: number) => {
    const getWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    };

    const daysWorkedByWeek: Record<number, number> = {};
    const totalDaysWorked = new Set<string>();

    jobs.forEach(job => {
        if (!job.assignedCrew.includes(crewId) || job.status === JobStatus.CANCELLED) return;
        
        let d = new Date(job.startDate);
        const end = new Date(job.endDate);
        
        while (d <= end) {
            if (d.getFullYear() === year && d.getMonth() === month) {
                const dayStr = d.toISOString().split('T')[0];
                totalDaysWorked.add(dayStr);
                
                const weekNum = getWeek(d);
                daysWorkedByWeek[weekNum] = (daysWorkedByWeek[weekNum] || 0) + 1;
            }
            d.setDate(d.getDate() + 1);
        }
    });

    let missedRestDays = 0;
    Object.values(daysWorkedByWeek).forEach(days => {
        if (days > 5) {
            missedRestDays += (days - 5);
        }
    });

    return {
        totalWorked: totalDaysWorked.size,
        missedRest: missedRestDays
    };
};