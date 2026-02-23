import { BadRequestException } from '@nestjs/common';

export function validatePromptPack(pack: any) {
  if (!pack || typeof pack !== 'object') {
    console.log(1)
    throw new BadRequestException('Prompt pack must be an object');
  }

  if (!Array.isArray(pack.parts)) {
    console.log(2)
    throw new BadRequestException('Prompt pack must contain parts[]');
  }

  if (pack.parts.length < 4 || pack.parts.length > 8) {
    console.log(3)
    throw new BadRequestException('Parts count must be between 4 and 8');
  }

  for (const part of pack.parts) {
    if (!part.part || !part.generation_prompt) {
    console.log(4, part.role)
      throw new BadRequestException('Each part must have part and generation_prompt');
    }

    if (typeof part.generation_prompt !== 'string') {
    console.log(5)
      throw new BadRequestException('generation_prompt must be string');
    }

    if (part.generation_prompt.length < 150 && part.generation_prompt.length != 0) {
    console.log(6)
      throw new BadRequestException(
        `generation_prompt too short for part ${part.part}`
      );
    }
  }
}
