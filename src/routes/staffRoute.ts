import { Router, Request, Response } from "express";
import {
  createStaff,
  getAllStaff,
  getStaffById,
} from "../services/staffService";

const router = Router();

// Create a new staff
router.post("/staff", async (req: Request, res: Response) => {
  try {
    const newStaff = await createStaff(req.body);
    res.status(201).json(newStaff);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get all staff
router.get("/staff", async (req: Request, res: Response) => {
  try {
    const staffList = await getAllStaff();
    res.status(200).json(staffList);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get staff by ID
router.get("/staff/:id", async (req: Request, res: Response) => {
  try {
    const staff = await getStaffById(req.params.id);
    if (!staff) {
      res.status(404).json({ error: "Staff not found" });
      return;
    }
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
    return;
  }
});

export default router;
