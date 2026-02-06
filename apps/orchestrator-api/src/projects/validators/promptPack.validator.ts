import { BadRequestException } from '@nestjs/common';

export function validatePromptPack(pack: any) {
  if (!pack || typeof pack !== 'object') {
    throw new BadRequestException('Prompt pack must be an object');
  }

  if (!Array.isArray(pack.parts)) {
    throw new BadRequestException('Prompt pack must contain parts[]');
  }

  if (pack.parts.length < 4 || pack.parts.length > 8) {
    throw new BadRequestException('Parts count must be between 4 and 8');
  }

  for (const part of pack.parts) {
    if (!part.part || !part.generation_prompt) {
      throw new BadRequestException('Each part must have part and generation_prompt');
    }

    if (typeof part.generation_prompt !== 'string') {
      throw new BadRequestException('generation_prompt must be string');
    }

    if (part.generation_prompt.length < 150) {
      throw new BadRequestException(
        `generation_prompt too short for part ${part.part}`
      );
    }
  }
}
