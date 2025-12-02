import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question!: string;
}
