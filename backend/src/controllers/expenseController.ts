import {
  JsonController,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFile,
  Res,
  HttpCode,
  NotFoundError,
  UseBefore,
  Req,
} from 'routing-controllers';
import { Type } from 'class-transformer';
import { Response } from 'express';
import { IsString, IsNumber, IsOptional, IsDate } from 'class-validator';
import Expense, { IExpense } from '../models/Expense';
import fs from 'fs';
import path from 'path';
import { fileUploadOptions, upload } from '../middleware/upload';
import { transformDocument, transformDocuments } from '../utils/mongoose.utils';

// DTO (Data Transfer Object) for expense creation/update
class ExpenseDto {
  @IsNumber()
  amount!: number;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  receipt?: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  };
}

@JsonController('/expenses')
export class ExpenseController {
  @Post()
  @HttpCode(201)
  async createExpense(@Body() data: ExpenseDto) {
    try {
      console.log('Creating expense with data:', data);
      const expense = new Expense(data);
      await expense.save();
      return transformDocument(expense.toObject());
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  @Post('/:id/receipt')
  @HttpCode(201)
  // @UseBefore(upload.single('receipt'))
  async uploadReceipt(
    @Param('id') id: string,
    @UploadedFile('receipt', { options: fileUploadOptions })
    file?: Express.Multer.File
  ) {
    try {
      console.log('Uploading receipt for expense:', id);
      console.log('Received file:', file);

      const expense = await Expense.findById(id);
      if (!expense) {
        throw new NotFoundError('Expense not found');
      }

      // Delete old receipt if exists
      if (expense.receipt?.path) {
        fs.unlinkSync(expense.receipt.path);
      }

      if (file) {
        expense.receipt = {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
        };
        await expense.save();
      }

      return { message: 'Receipt uploaded successfully' };
    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    }
  }

  @Get()
  async getExpenses() {
    const expenses = await Expense.find().sort({ date: -1 }).lean();
    return transformDocuments(expenses);
  }

  @Get('/:id')
  async getExpenseById(@Param('id') id: string) {
    const expense = await Expense.findById(id).lean();
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }
    return transformDocument(expense);
  }

  @Put('/:id')
  async updateExpense(
    @Param('id') id: string,
    @Body() expenseData: ExpenseDto,
    @UploadedFile('receipt') file?: Express.Multer.File
  ) {
    if (file) {
      const oldExpense = await Expense.findById(id);
      if (oldExpense?.receipt?.path) {
        fs.unlinkSync(oldExpense.receipt.path);
      }

      expenseData = {
        ...expenseData,
        receipt: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
        },
      };
    }

    const expense = await Expense.findByIdAndUpdate(id, expenseData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }
    return transformDocument(expense);
  }

  @Delete('/:id')
  async deleteExpense(@Param('id') id: string) {
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    if (expense.receipt?.path) {
      fs.unlinkSync(expense.receipt.path);
    }

    await expense.deleteOne();
    return { message: 'Expense deleted successfully' };
  }

  @Get('/:id/receipt')
  async getReceipt(@Param('id') id: string, @Res() res: Response) {
    const expense = await Expense.findById(id);
    if (!expense || !expense.receipt) {
      throw new NotFoundError('Receipt not found');
    }

    const filePath = path.resolve(expense.receipt.path);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('Receipt file not found on server');
    }

    res.setHeader('Content-Type', expense.receipt.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${expense.receipt.originalName}"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    return res;
  }
}
