interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class Cache {
  private static instance: Cache;
  private cache = new Map<string, CacheItem<unknown>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cache keys for common data
  static keys = {
    userProfile: (userId: string) => `user:profile:${userId}`,
    teacherAssignments: (teacherId: string) => `teacher:assignments:${teacherId}`,
    studentEnrollments: (studentId: string) => `student:enrollments:${studentId}`,
    programs: () => 'data:programs',
    levels: () => 'data:levels',
    subjects: () => 'data:subjects',
    timetables: () => 'data:timetables',
    studentTimetables: (studentId: string) => `student:timetables:${studentId}`,
    teacherTimetables: (teacherId: string) => `teacher:timetables:${teacherId}`,
    liveClasses: () => 'data:live_classes',
    liveClassParticipants: (liveClassId: string) => `live_class:participants:${liveClassId}`,
    classNotifications: () => 'data:class_notifications',
    studentTimetableView: (studentId: string) => `view:student_timetable:${studentId}`,
    teacherTimetableView: (teacherId: string) => `view:teacher_timetable:${teacherId}`,
    liveClassesView: () => 'view:live_classes',
  };
}

export const cache = Cache.getInstance();
