export const HttpEndpoints = {
    ROSTER: (schoolYear: string) => ["People", schoolYear],
    ATTENDANCE_ON_DAY: (schoolYear: string, date: string) => ["Dates", schoolYear, date],
    ALL_SHIFTS_ROSTER: () => ["People"],
    PERMISSIONS: (userInfo: any) => ["users", userInfo.user_id],
    ADD_USER: (emailId: string) => ["register", emailId],
    ADD_SHIFT: (day: string, time: string, schoolYear: string) => [day, time, "People", schoolYear],
    UPDATE_ROSTER: (schoolYear: string, role: string, grade: string = ""): string[] => ["People", schoolYear, role, grade],
    UPDATE_ATTEDANCE: (schoolYear: string, date: string, role: string, name: string, grade: string = ""): string[] => ["Dates", schoolYear, date, role, grade, name],
    INVENTORY_TOTAL: (list: string[]) => ["inventory", "total", ...list],
    INVENTORY_CHECKIN: (list: string[]) => ["inventory", "checkin", ...list],
    INVENTORY_CHECKOUT: (list: string[]) => ["inventory", "checkout", ...list],
}

export const ENDPOINTS = {
  BASE: "Base",
  ATTENDANCE: "Attendance",
  INVENTORY: "Inventory"
}