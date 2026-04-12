import { Test, TestingModule } from '@nestjs/testing';
import { LessonResolver } from './lesson.resolver';
import { LessonService } from './lesson.service';
import { StudentService } from '../student/student.service';
import { Lesson } from './lesson.entity';

const mockLesson = (): Lesson => ({
  _id: 'objectId1',
  id: 'uuid-1',
  name: 'Math 101',
  startDate: '2026-01-01T09:00:00Z',
  endDate: '2026-01-01T10:00:00Z',
  students: [],
});

describe('LessonResolver', () => {
  let resolver: LessonResolver;
  let lessonService: LessonService;
  let studentService: StudentService;

  const mockLessonService = {
    getLesson: jest.fn(),
    getLessons: jest.fn(),
    createLesson: jest.fn(),
    asignStudentsToLesson: jest.fn(),
  };

  const mockStudentService = {
    getManyStudents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonResolver,
        { provide: LessonService, useValue: mockLessonService },
        { provide: StudentService, useValue: mockStudentService },
      ],
    }).compile();

    resolver = module.get<LessonResolver>(LessonResolver);
    lessonService = module.get<LessonService>(LessonService);
    studentService = module.get<StudentService>(StudentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('lesson', () => {
    it('should return a lesson by id', async () => {
      const lesson = mockLesson();
      mockLessonService.getLesson.mockResolvedValue(lesson);

      const result = await resolver.lesson('uuid-1');

      expect(mockLessonService.getLesson).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual(lesson);
    });

    it('should return undefined when lesson not found', async () => {
      mockLessonService.getLesson.mockResolvedValue(undefined);

      const result = await resolver.lesson('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('lessons', () => {
    it('should return all lessons', async () => {
      const lessons = [mockLesson(), { ...mockLesson(), id: 'uuid-2' }];
      mockLessonService.getLessons.mockResolvedValue(lessons);

      const result = await resolver.lessons();

      expect(mockLessonService.getLessons).toHaveBeenCalled();
      expect(result).toEqual(lessons);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no lessons exist', async () => {
      mockLessonService.getLessons.mockResolvedValue([]);

      const result = await resolver.lessons();

      expect(result).toEqual([]);
    });
  });

  describe('createLesson', () => {
    it('should create and return a lesson', async () => {
      const createLessonInput = {
        name: 'Math 101',
        startDate: '2026-01-01T09:00:00Z',
        endDate: '2026-01-01T10:00:00Z',
        students: [],
      };
      const lesson = mockLesson();
      mockLessonService.createLesson.mockResolvedValue(lesson);

      const result = await resolver.createLesson(createLessonInput);

      expect(mockLessonService.createLesson).toHaveBeenCalledWith(createLessonInput);
      expect(result).toEqual(lesson);
    });
  });

  describe('assignStudentsToLesson', () => {
    it('should assign students to a lesson', async () => {
      const assignInput = {
        lessonId: 'uuid-1',
        studentIds: ['student-1', 'student-2'],
      };
      const updatedLesson = {
        ...mockLesson(),
        students: ['student-1', 'student-2'],
      };
      mockLessonService.asignStudentsToLesson.mockResolvedValue(updatedLesson);

      const result = await resolver.assignStudentsToLesson(assignInput);

      expect(mockLessonService.asignStudentsToLesson).toHaveBeenCalledWith(
        'uuid-1',
        ['student-1', 'student-2'],
      );
      expect(result).toEqual(updatedLesson);
    });
  });

  describe('students (ResolveField)', () => {
    it('should resolve students for a lesson', async () => {
      const lesson = { ...mockLesson(), students: ['student-1', 'student-2'] };
      const students = [
        { _id: 'obj1', id: 'student-1', firstName: 'John', lastName: 'Doe' },
        { _id: 'obj2', id: 'student-2', firstName: 'Jane', lastName: 'Smith' },
      ];
      mockStudentService.getManyStudents.mockResolvedValue(students);

      const result = await resolver.students(lesson);

      expect(mockStudentService.getManyStudents).toHaveBeenCalledWith([
        'student-1',
        'student-2',
      ]);
      expect(result).toEqual(students);
    });

    it('should return an empty array when lesson has no students', async () => {
      const lesson = mockLesson();
      mockStudentService.getManyStudents.mockResolvedValue([]);

      const result = await resolver.students(lesson);

      expect(mockStudentService.getManyStudents).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });
});
