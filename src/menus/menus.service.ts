import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateMenusDto } from './dto/create-menus.dto';
import { Equal, IsNull, Or, Repository } from 'typeorm';
import { MenusEntity } from './entities/menus.entity';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';

@Injectable()
export class MenusService {
  constructor(
    @Inject('MENUS_REPOSITORY')
    private readonly menusRepository: Repository<MenusEntity>
  ) { }

  async getAllParentMenus() {
    const menus = await this.menusRepository.find({
      select: {
        name: true,
        childMenus: {}
      },
      where: {
        parentMenus: IsNull()
      },
      relations: {
        childMenus: {
          parentMenus: true
        }
      }
    });

    return menus.map(m => m.name);
  }

  async getParentMenus(id: number) {
    return await this.menusRepository.find({
      select: {
        name: true,
        icon: true,
        childMenus: {
          id: true,
          order: true,
          name: true,
          link: true,
          parentMenus: {}
        }
      },
      where: {
        id,
        parentMenus: IsNull()
      },
      relations: {
        childMenus: {
          parentMenus: true
        }
      }
    });
  }

  async getMenusByAuths(user: TTokenPayload) {
    const menus = await this.menusRepository.find({
      select: {
        name: true,
        icon: true,
        childMenus: {
          name: true,
          link: true,
          parentMenus: {}
        }
      },
      where: {
        childMenus: {
          auths: { code: Or(...user.auths.map(a => Equal(a))) }
        }
      },
      relations: {
        childMenus: {
          parentMenus: true
        }
      },
      order: {
        childMenus: {
          order: 'ASC'
        }
      }
    });

    return menus;
  }

  async createMenus(createMenusDto: CreateMenusDto) {
    // parentId가 존재한다면 자식 메뉴
    if (createMenusDto.parentId) {
      // 자식 메뉴는 link가 있어야 하며, icon은 없어야 함 
      if (!createMenusDto.link || createMenusDto.icon)
        throw new BadRequestException(ExceptionMessages.NO_PARAMETER)

    } else {
      if (createMenusDto.link || !createMenusDto.icon)
        throw new BadRequestException(ExceptionMessages.NO_PARAMETER)
    }


    const parents = await this.menusRepository.findOne({ where: { id: createMenusDto.parentId } })
    const menus = await this.menusRepository.create({ ...createMenusDto, parentMenus: parents });

    return await this.menusRepository.save(menus);
  }
}
