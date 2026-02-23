import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseService } from "src/database/database.service";
import { CreateMachineDto } from "./dto/create-machine.dto";
import { UpdateMachineDto } from "./dto/update-machine.dto";
import { MachinesService } from "./machines.service";

describe("MachinesService", () => {
  let machineService: MachinesService;
  const dbMock = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),

    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn(),

    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };
  const databaseServiceMock = { db: dbMock };
  const createDto: CreateMachineDto = {
    name: "Cobas 6000",
    hospCode: "LAB-EQ-001",
    sectionId: 1,
  };
  const updateDto: UpdateMachineDto = {
    name: "Cobas 6000 Updated",
  };
  const machine = {
    id: 1,
    name: "Cobas 6000",
    hospCode: "LAB-EQ-001",
    sectionId: 1,
  };
  const machineList = [
    machine,
    {
      id: 2,
      name: "Sysmex XN",
      hospCode: "LAB-EQ-002",
      sectionId: 2,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachinesService,
        { provide: DatabaseService, useValue: databaseServiceMock },
      ],
    }).compile();
    machineService = module.get<MachinesService>(MachinesService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(machineService).toBeDefined();
  });

  describe("create", () => {
    it("returns the created machine on success", async () => {
      dbMock.returning.mockResolvedValue([machine]);

      await expect(machineService.create(createDto)).resolves.toEqual(machine);
      expect(dbMock.insert).toHaveBeenCalledTimes(1);
      expect(dbMock.values).toHaveBeenCalledTimes(1);
      expect(dbMock.returning).toHaveBeenCalledTimes(1);
    });

    it("throws BadRequestException for invalid section id", async () => {
      dbMock.returning.mockRejectedValue({ code: "23503" });

      await expect(machineService.create(createDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("throws ConflictException for duplicate machine", async () => {
      dbMock.returning.mockRejectedValue({ code: "23505" });

      await expect(machineService.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it("throws InternalServerErrorException for unknown db error", async () => {
      dbMock.returning.mockRejectedValue({ code: "99999" });

      await expect(machineService.create(createDto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe("findAll", () => {
    it("returns all machines", async () => {
      dbMock.from.mockResolvedValue(machineList);

      await expect(machineService.findAll()).resolves.toEqual(machineList);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
      expect(dbMock.from).toHaveBeenCalledTimes(1);
    });
  });

  describe("findOne", () => {
    it("returns a machine when found", async () => {
      dbMock.from.mockReturnThis();
      dbMock.where.mockResolvedValue([machine]);

      await expect(machineService.findOne(1)).resolves.toEqual(machine);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
      expect(dbMock.from).toHaveBeenCalledTimes(1);
      expect(dbMock.where).toHaveBeenCalledTimes(1);
    });

    it("throws NotFoundException when machine does not exist", async () => {
      dbMock.from.mockReturnThis();
      dbMock.where.mockResolvedValue([]);

      await expect(machineService.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("returns the updated machine on success", async () => {
      dbMock.where.mockReturnThis();
      dbMock.returning.mockResolvedValue([machine]);

      await expect(machineService.update(1, updateDto)).resolves.toEqual(machine);
      expect(dbMock.update).toHaveBeenCalledTimes(1);
      expect(dbMock.set).toHaveBeenCalledTimes(1);
      expect(dbMock.where).toHaveBeenCalledTimes(1);
      expect(dbMock.returning).toHaveBeenCalledTimes(1);
    });

    it("throws NotFoundException when machine does not exist", async () => {
      dbMock.where.mockReturnThis();
      dbMock.returning.mockResolvedValue([]);

      await expect(machineService.update(999, updateDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("throws BadRequestException for invalid section id", async () => {
      dbMock.where.mockReturnThis();
      dbMock.returning.mockRejectedValue({ code: "23503" });

      await expect(machineService.update(1, updateDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("remove", () => {
    it("returns the deleted machine on success", async () => {
      dbMock.where.mockReturnThis();
      dbMock.returning.mockResolvedValue([machine]);

      await expect(machineService.remove(1)).resolves.toEqual(machine);
      expect(dbMock.delete).toHaveBeenCalledTimes(1);
      expect(dbMock.where).toHaveBeenCalledTimes(1);
      expect(dbMock.returning).toHaveBeenCalledTimes(1);
    });

    it("throws NotFoundException when machine does not exist", async () => {
      dbMock.where.mockReturnThis();
      dbMock.returning.mockResolvedValue([]);

      await expect(machineService.remove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
