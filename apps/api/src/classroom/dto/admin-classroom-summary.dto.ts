import { ApiProperty } from '@nestjs/swagger';

export class AdminClassroomSummaryDto {
  @ApiProperty()
  courses: number;

  @ApiProperty()
  enrollments: number;
}
