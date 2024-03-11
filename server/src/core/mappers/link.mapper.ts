import { LinkPreviewDto, LinkDto } from 'src/features/link/link.dto';
import { Link } from '../entities/link.entity';
import { WordMapper } from './word.mapper';

export class LinkMapper {
  private constructor() {}

  static toPreview(link: Link): LinkPreviewDto {
    return {
      id: link.id,
      title: link.title,
    };
  }

  static toDto(link: Link): LinkDto {
    return {
      id: link.id,
      title: link.title,
      desc: link.desc,
      words: link.words.map((word) => WordMapper.toPreview(word)),
    };
  }
}