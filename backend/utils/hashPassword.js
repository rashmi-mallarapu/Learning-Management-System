import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';

export const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, env.bcryptSaltRounds);

export const comparePassword = async (plainPassword, hashedPassword) =>
	bcrypt.compare(plainPassword, hashedPassword);
