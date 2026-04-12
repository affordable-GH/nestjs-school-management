import { Test, TestingModule } from '@nestjs/testing';
import { StudentResolver } from './student.resolver';
import { StudentService } from './student.service';

const mockStudent = () => ({
  _id: 'objectId1',
  id: 'uuid-1',
  firstName: 'John',
  lastName: 'Doe',
});

describe('StudentResolver', () => {
  let resolver: StudentResolver;
  let studentService: StudentService;

  const mockStudentService = {
    getStudent: jest.fn(),
    getStudents: jest.fn(),
    createStudent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentResolver,
        { provide: StudentService, useValue: mockStudentService },
      ],
    }).compile();

    resolver = module.get<StudentResolver>(StudentResolver);
    studentService = module.get<StudentService>(StudentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('student', () => {
    it('should return a student by id', async () => {
      const student = mockStudent();
      mockStudentService.getStudent.mockResolvedValue(student);

      const result = await resolver.student('uuid-1');

      expect(mockStudentService.getStudent).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual(student);
    });

    it('should return undefined when student not found', async () => {
      mockStudentService.getStudent.mockResolvedValue(undefined);

      const result = await resolver.student('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('students', () => {
    it('should return all students', async () => {
      const students = [
        mockStudent(),
        { ...mockStudent(), id: 'uuid-2', firstName: 'Jane', lastName: 'Smith' },
      ];
      mockStudentService.getStudents.mockResolvedValue(students);

      const result = await resolver.students();

      expect(mockStudentService.getStudents).toHaveBeenCalled();
      expect(result).toEqual(students);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no students exist', async () => {
      mockStudentService.getStudents.mockResolvedValue([]);

      const result = await resolver.students();

      expect(result).toEqual([]);
    });
  });

  describe('createStudent', () => {
    it('should create and return a student', async () => {
      const createStudentInput = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const student = mockStudent();
      mockStudentService.createStudent.mockResolvedValue(student);

      const result = await resolver.createStudent(createStudentInput);

      expect(mockStudentService.createStudent).toHaveBeenCalledWith(createStudentInput);
      expect(result).toEqual(student);
    });
  });
});
