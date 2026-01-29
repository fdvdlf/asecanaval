import { ApiProperty } from '@nestjs/swagger';

export class ModuleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  order: number;
}

export class ModuleProgressDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  module_id: number;

  @ApiProperty({ nullable: true })
  completed_at?: Date | null;
}
