import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonService } from './lesson.service';
import { Lesson } from './lesson.entity';

const mockLesson = (): Lesson => ({
  _id: 'objectId1',
  id: 'uuid-1',
  name: 'Math 101',
  startDate: '2026-01-01T09:00:00Z',
  endDate: '2026-01-01T10:00:00Z',
  students: [],
});

describe('LessonService', () => {
  let service: LessonService;
  let repository: Repository<Lesson>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonService,
        {
          provide: getRepositoryToken(Lesson),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LessonService>(LessonService);
    repository = module.get<Repository<Lesson>>(getRepositoryToken(Lesson));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLesson', () => {
    it('should return a lesson by id', async () => {
      const lesson = mockLesson();
      mockRepository.findOne.mockResolvedValue(lesson);

      const result = await service.getLesson('uuid-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(result).toEqual(lesson);
    });

    it('should return undefined when lesson is not found', async () => {
      mockRepository.findOne.mockResolvedValue(undefined);

      const result = await service.getLesson('nonexistent-id');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        id: 'nonexistent-id',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('getLessons', () => {
    it('should return an array of lessons', async () => {
      const lessons = [mockLesson(), { ...mockLesson(), id: 'uuid-2', name: 'Science 101' }];
      mockRepository.find.mockResolvedValue(lessons);

      const result = await service.getLessons();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(lessons);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no lessons exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getLessons();

      expect(result).toEqual([]);
    });
  });

  describe('createLesson', () => {
    it('should create and return a new lesson', async () => {
      const createLessonInput = {
        name: 'Math 101',
        startDate: '2026-01-01T09:00:00Z',
        endDate: '2026-01-01T10:00:00Z',
        students: [],
      };
      const lesson = mockLesson();
      mockRepository.create.mockReturnValue(lesson);
      mockRepository.save.mockResolvedValue(lesson);

      const result = await service.createLesson(createLessonInput);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Math 101',
          startDate: '2026-01-01T09:00:00Z',
          endDate: '2026-01-01T10:00:00Z',
          students: [],
        }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(lesson);
      expect(result).toEqual(lesson);
    });

    it('should create a lesson with student ids', async () => {
      const studentIds = ['student-1', 'student-2'];
      const createLessonInput = {
        name: 'Physics 101',
        startDate: '2026-02-01T09:00:00Z',
        endDate: '2026-02-01T10:00:00Z',
        students: studentIds,
      };
      const lesson = { ...mockLesson(), students: studentIds };
      mockRepository.create.mockReturnValue(lesson);
      mockRepository.save.mockResolvedValue(lesson);

      const result = await service.createLesson(createLessonInput);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          students: studentIds,
        }),
      );
      expect(result.students).toEqual(studentIds);
    });

    it('should generate a UUID for the lesson id', async () => {
      const createLessonInput = {
        name: 'Chemistry',
        startDate: '2026-03-01T09:00:00Z',
        endDate: '2026-03-01T10:00:00Z',
        students: [],
      };
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((data) => Promise.resolve(data));

      await service.createLesson(createLessonInput);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
        }),
      );
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('asignStudentsToLesson', () => {
    it('should assign students to a lesson', async () => {
      const lesson = mockLesson();
      const studentIds = ['student-1', 'student-2'];
      const updatedLesson = { ...lesson, students: studentIds };

      mockRepository.findOne.mockResolvedValue(lesson);
      mockRepository.save.mockResolvedValue(updatedLesson);

      const result = await service.asignStudentsToLesson('uuid-1', studentIds);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          students: studentIds,
        }),
      );
      expect(result).toEqual(updatedLesson);
    });

    it('should append students to existing students', async () => {
      const lesson = { ...mockLesson(), students: ['existing-student'] };
      const newStudentIds = ['student-1', 'student-2'];
      const expectedStudents = ['existing-student', 'student-1', 'student-2'];
      const updatedLesson = { ...lesson, students: expectedStudents };

      mockRepository.findOne.mockResolvedValue(lesson);
      mockRepository.save.mockResolvedValue(updatedLesson);

      const result = await service.asignStudentsToLesson('uuid-1', newStudentIds);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          students: expectedStudents,
        }),
      );
      expect(result.students).toEqual(expectedStudents);
    });

    it('should handle assigning an empty array of students', async () => {
      const lesson = mockLesson();
      mockRepository.findOne.mockResolvedValue(lesson);
      mockRepository.save.mockResolvedValue(lesson);

      const result = await service.asignStudentsToLesson('uuid-1', []);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          students: [],
        }),
      );
      expect(result).toEqual(lesson);
    });
  });
});
