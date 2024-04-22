import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateMenusDto } from './dto/create-menus.dto';
import { Equal, IsNull, Or, Repository } from 'typeorm';
import { MenusEntity } from './entities/menus.entity';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';
import { UpdateMenusDto } from './dto/update-menus.dto';

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

  async createMenus(dto: CreateMenusDto) {
    // 정합성 검사
    this.isParentMenu(dto);

    const parents = await this.menusRepository.findOne({ where: { id: dto.parentId } })
    const menus = await this.menusRepository.create({ ...dto, parentMenus: parents });

    return await this.menusRepository.save(menus);
  }

  async updateMenus(dto: UpdateMenusDto) {
    // 정합성 검사
    this.isParentMenu(dto);

    const oriMenu = await this.menusRepository.findOne({ where: { id: dto.id } })

    return await this.menusRepository.save({
      ...oriMenu,
      ...dto
    })

  }

  private isParentMenu(dto: CreateMenusDto) {
    if (dto.parentId) {
      // 자식 메뉴는 link가 있어야 하며, icon은 없어야 함 
      if (!dto.link || dto.icon)
        throw new BadRequestException(ExceptionMessages.NO_PARAMETER);

    } else {
      // 부모 메뉴는 link가 없어야 하며, icon이 있어야함
      if (dto.link || !dto.icon)
        throw new BadRequestException(ExceptionMessages.NO_PARAMETER);
    }
  }

  async deleteMenus(id: number, all: boolean) {
    const menus = await this.menusRepository.findOne({
      where: { id },
      relations: {
        childMenus: true
      }
    });

    if (!menus) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID);

    const childMenus = menus.childMenus;

    if (childMenus.length > 0) {
      if (!all) {
        throw new BadRequestException(ExceptionMessages.HAS_CHILD_MENUS)
      }

      await this.menusRepository.delete({
        id: Or(...childMenus.map(c => Equal(c.id)))
      });
    }

    return await this.menusRepository.delete({ id: menus.id });
  }
}
