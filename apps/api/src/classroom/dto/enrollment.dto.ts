import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'DNI del socio a matricular' })
  @IsString()
  @IsNotEmpty()
  dni: string;
}

export class EnrollmentMemberDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  dni: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  grado: string;

  @ApiProperty()
  promocion: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  enrolled_at: Date;
}

export class EnrollmentListResponseDto {
  @ApiProperty({ type: [EnrollmentMemberDto] })
  data: EnrollmentMemberDto[];
}
