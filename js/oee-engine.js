// js/oee-engine.js

/**
 * กำลังการผลิตสูงสุดตามทฤษฎี 100% (Ideal Capacity Rate) ของแต่ละเครื่อง (ชิ้น/ชั่วโมง)
 */
const MACHINE_IDEAL_CAPACITY = {
  'M1': 200, // 200 ชิ้น/ชม.
  'M2': 180, // 180 ชิ้น/ชม.
  'M3': 160, // 160 ชิ้น/ชม.
  'M4': 140  // 140 ชิ้น/ชม.
};

/**
 * คำนวณ OEE, A, P, Q เฉลี่ยสะสมรวม และสร้างข้อมูล OEE แยกรายชั่วโมง
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
      totalTargetOutput: 0,
      idealCapacity: idealRate,
      hourlyLogs: []
    };
  }

  // เรียงลำดับ logs ตามเวลา timestamp
  const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
  const latestLog = sortedLogs[sortedLogs.length - 1];

  let operatingHours = 0;     // จำนวนครั้ง/ชั่วโมงที่เป็น RUNNING
  let plannedHours = 0;       // จำนวนครั้ง/ชั่วโมงทั้งหมดที่บันทึก
  let totalActualOutput = 0;   // ชิ้นงานที่ผลิตได้จริงสะสม
  let sumPerfRunning = 0;     // ผลรวม % Load ตอน RUNNING

  // ⏱️ วนลูปสร้างข้อมูล OEE แยกแต่ละชั่วโมง
  const hourlyLogs = sortedLogs.map((log, index) => {
    plannedHours += 1;
    let a = 0, p = 0, q = 100, hourlyOee = 0, actualPcs = 0;

    if (log.eventType === 'RUNNING') {
      operatingHours += 1;
      const perf = log.perfRate || 0;
      sumPerfRunning += perf;
      
      a = 100;
      p = perf;
      q = 100;
      hourlyOee = perf; // OEE ของชั่วโมงนี้ = A(100%) * P(perf%) * Q(100%)
      actualPcs = Math.round(idealRate * (perf / 100));
    } else {
      // SETUP หรือ BREAKDOWN
      a = 0; p = 0; q = 100; hourlyOee = 0; actualPcs = 0;
    }

    totalActualOutput += actualPcs;

    return {
      hourIndex: index + 1,
      timestamp: log.timestamp,
      keyPressed: log.keyPressed || '-',
      eventType: log.eventType,
      perfRate: log.perfRate || 0,
      a: a,
      p: p,
      q: q,
      oee: hourlyOee, // ค่า OEE เฉพาะชั่วโมงนี้
      actualPcs: actualPcs,
      targetPcs: idealRate
    };
  });

  // คำนวณค่าเฉลี่ยสะสมรวมสำหรับโชร์การ์ดหน้าหลัก
  const averageA = plannedHours > 0 ? (operatingHours / plannedHours) * 100 : 0;
  const averageP = operatingHours > 0 ? (sumPerfRunning / operatingHours) : 0;
  const averageQ = 100;
  const averageOEE = (averageA / 100) * (averageP / 100) * (averageQ / 100) * 100;
  const totalPlannedTarget = plannedHours * idealRate;

  return {
    availability: Number(averageA.toFixed(1)),
    performance: Number(averageP.toFixed(1)),
    quality: Number(averageQ.toFixed(1)),
    oee: Number(averageOEE.toFixed(1)),
    status: latestLog ? latestLog.eventType : 'STOP',
    currentKey: latestLog ? (latestLog.keyPressed || '-') : '-',
    totalActualOutput: Math.round(totalActualOutput),
    totalTargetOutput: Math.round(totalPlannedTarget),
    idealCapacity: idealRate,
    hourlyLogs: hourlyLogs // อาร์เรย์ข้อมูล OEE แยกรายชั่วโมง
  };
}