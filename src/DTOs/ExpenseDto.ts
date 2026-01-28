import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class UpdateExpenseDto extends CreateExpenseDto {}
