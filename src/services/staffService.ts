import Staff from "../models/staffModel";

export const getAllStaff = async () => {
  return await Staff.find();
};
