// js/oee-engine.js

/**
 * กำลังการผลิตสูงสุดตามทฤษฎี 100% (Ideal Capacity Rate) ของแต่ละเครื่อง (ชิ้น/ชั่วโมง)
 */
const MACHINE_IDEAL_CAPACITY = {
  'M1': 200, // 200 ชิ้น/ชม.
  'M2': 180, // 180 ชิ้น/ชม. (200 * 0.9)
  'M3': 160, // 160 ชิ้น/ชม. (200 * 0.8)
  'M4': 140  // 140 ชิ้น/ชม. (200 * 0.7)
};

/**
 * คำนวณ OEE ตามหลักวิชาการสากล (Output Target-based Performance)
 */
export function calculateOEE(logs, machineId = 'M1') {
  const idealRate = MACHINE_IDEAL_CAPACITY[machineId] || 200;

  if (!logs || logs.length === 0) {
    return { 
      availability: 0, 
      performance: 0, 
      quality: 100, 
      oee: 0, 
      status: 'STOP', 
      currentKey: '-',
      totalActualOutput: 0,
      totalIdealTarget: 0
    };
  }

  // เรียงลำดับ logs ตามเวลา timestamp
  const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
  const latestLog = sortedLogs[sortedLogs.length - 1];

  let operatingHours = 0; // ชั่วโมง RUNNING
  let plannedHours = 0;   // ชั่วโมงรวมทั้งหมด
  let totalActualOutput = 0; // จำนวนชิ้นงานที่ผลิตได้จริงสะสม
  let totalIdealTarget = 0;  // จำนวนชิ้นงานเป้าหมายสูงสุดสะสม (100% Ideal)

  // วนลูปคำนวณผลผลิตรายชั่วโมง (1 กด = 1 ชั่วโมง)
  sortedLogs.forEach(log => {
    plannedHours += 1;

    if (log.eventType === 'RUNNING') {
      operatingHours += 1;
      
      // คำนวณชิ้นงานจริงที่ผลิตได้ตาม Load % จากปุ่มกด (2=60%, 3=70%, 4-6=80%)
      const loadPercent = (log.perfRate || 0) / 100;
      const actualProducedPcs = idealRate * loadPercent;
      
      totalIdealTarget += idealRate;     // เป้าหมายสูงสุดเต็ม 100%
      totalActualOutput += actualProducedPcs; // ชิ้นงานที่ผลิตได้จริงตามกำลังโหลด
    } else {
      // SETUP หรือ BREAKDOWN
      totalIdealTarget += 0;
      totalActualOutput += 0;
    }
  });

  // 1. Availability (%) = (Operating Hours / Planned Hours) * 100
  const availability = plannedHours > 0 ? (operatingHours / plannedHours) * 100 : 0;

  // 2. Performance (%) = (ชิ้นงานผลิตได้จริงสะสม / ชิ้นงานเป้าหมายสูงสุดสะสม) * 100
  let performance = 0;
  if (latestLog.eventType === 'RUNNING') {
    performance = totalIdealTarget > 0 ? (totalActualOutput / totalIdealTarget) * 100 : 0;
  } else {
    performance = 0; // ถ้าหยุดเครื่อง/เสีย P = 0%
  }

  // 3. Quality (%) = 100% เสมอตามโจทย์
  const quality = 100;

  // 4. OEE (%) = A * P * Q
  const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

  return {
    availability: Number(availability.toFixed(1)),
    performance: Number(performance.toFixed(1)),
    quality: Number(quality.toFixed(1)),
    oee: Number(oee.toFixed(1)),
    status: latestLog.eventType,
    currentKey: latestLog.keyPressed || '-',
    totalActualOutput: Math.round(totalActualOutput),
    totalTargetOutput: Math.round(totalIdealTarget),
    idealCapacity: idealRate
  };
}