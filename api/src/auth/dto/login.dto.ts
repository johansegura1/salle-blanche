import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'claire' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'secret' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
