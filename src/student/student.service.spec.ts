import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentService } from './student.service';
import { Student } from './student.entity';

const mockStudent = (): Student => ({
  _id: 'objectId1',
  id: 'uuid-1',
  firstName: 'John',
  lastName: 'Doe',
});

describe('StudentService', () => {
  let service: StudentService;
  let repository: Repository<Student>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: getRepositoryToken(Student),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
    repository = module.get<Repository<Student>>(getRepositoryToken(Student));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStudent', () => {
    it('should create and return a new student', async () => {
      const createStudentInput = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const student = mockStudent();
      mockRepository.create.mockReturnValue(student);
      mockRepository.save.mockResolvedValue(student);

      const result = await service.createStudent(createStudentInput);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
        }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(student);
      expect(result).toEqual(student);
    });

    it('should generate a UUID for the student id', async () => {
      const createStudentInput = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((data) => Promise.resolve(data));

      await service.createStudent(createStudentInput);

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

  describe('getStudent', () => {
    it('should return a student by id', async () => {
      const student = mockStudent();
      mockRepository.findOne.mockResolvedValue(student);

      const result = await service.getStudent('uuid-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(result).toEqual(student);
    });

    it('should return undefined when student is not found', async () => {
      mockRepository.findOne.mockResolvedValue(undefined);

      const result = await service.getStudent('nonexistent-id');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        id: 'nonexistent-id',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('getStudents', () => {
    it('should return an array of students', async () => {
      const students = [
        mockStudent(),
        { ...mockStudent(), id: 'uuid-2', firstName: 'Jane', lastName: 'Smith' },
      ];
      mockRepository.find.mockResolvedValue(students);

      const result = await service.getStudents();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(students);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no students exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getStudents();

      expect(result).toEqual([]);
    });
  });

  describe('getManyStudents', () => {
    it('should return students matching the given ids', async () => {
      const students = [
        mockStudent(),
        { ...mockStudent(), id: 'uuid-2', firstName: 'Jane', lastName: 'Smith' },
      ];
      mockRepository.find.mockResolvedValue(students);

      const result = await service.getManyStudents(['uuid-1', 'uuid-2']);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          id: {
            $in: ['uuid-1', 'uuid-2'],
          },
        },
      });
      expect(result).toEqual(students);
    });

    it('should return an empty array when no matching students found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getManyStudents(['nonexistent']);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          id: {
            $in: ['nonexistent'],
          },
        },
      });
      expect(result).toEqual([]);
    });

    it('should handle an empty array of student ids', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getManyStudents([]);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          id: {
            $in: [],
          },
        },
      });
      expect(result).toEqual([]);
    });
  });
});
