import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
