import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateMenusDto } from './dto/create-menus.dto';
import { Equal, FindOptionsWhere, IsNull, Or, Repository } from 'typeorm';
import { MenusEntity } from './entities/menus.entity';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';
import { UpdateMenusDto } from './dto/update-menus.dto';
import { MenuPaginationDto } from './dto/menu-pagination.dto';
import { CommonService } from 'src/common/common.service';
import AuthsEnum from 'src/auths/const/auths.enums';

@Injectable()
export class MenusService {
  constructor(
    @Inject('MENUS_REPOSITORY')
    private readonly menusRepository: Repository<MenusEntity>,
    private readonly commonService: CommonService,
  ) {}

  async getAllParentMenus() {
    const menus = await this.getAllMenus();

    return menus.map((m) => ({ id: m.id, name: m.name, icon: m.icon, order: m.order }));
  }

  async getParentMenus(id: number) {
    return await this.menusRepository.findOne({
      select: {
        id: true,
        name: true,
        icon: true,
        order: true,
        childMenus: {
          id: true,
          order: true,
          name: true,
          link: true,
          parentMenus: {},
        },
      },
      where: {
        id: id,
        parentMenus: IsNull(),
      },
      relations: {
        childMenus: {
          parentMenus: true,
        },
      },
      order: {
        order: 'ASC',
        childMenus: {
          order: 'ASC',
        },
      },
    });
  }

  async getMenusByAuths(user: TTokenPayload) {
    let where: FindOptionsWhere<MenusEntity> = {
      childMenus: {
        auths: { code: Or(...user.auths.map((a) => Equal(a))) },
      },
    };

    if (user.auths.includes(AuthsEnum.SUPER_USER)) {
      where = {
        parentMenus: IsNull(),
      };
    }

    return await this.menusRepository.find({
      select: {
        name: true,
        icon: true,
        childMenus: {
          name: true,
          link: true,
          parentMenus: {},
        },
      },
      where,
      relations: {
        childMenus: {
          parentMenus: true,
        },
      },
      order: {
        order: 'ASC',
        childMenus: {
          order: 'ASC',
        },
      },
    });
  }

  async createMenus(dto: CreateMenusDto) {
    // 정합성 검사
    this.isParentMenu(dto);

    const menus = await this.menusRepository.create({ ...dto, parentMenus: { id: dto.parentId } });

    return await this.menusRepository.save(menus);
  }

  async updateMenus(dto: UpdateMenusDto) {
    const oriMenu = await this.menusRepository.findOne({ where: { id: dto.id } });

    const cm = dto.childMenus;

    if (cm) {
      for (let i = 0; i < cm.length; i++) {
        const oriChildMenu = await this.menusRepository.findOne({ where: { id: cm[i].id } });

        await this.menusRepository.save({
          ...oriChildMenu,
          ...cm[i],
        });
      }
    }

    const update = {
      ...oriMenu,
      ...dto,
    };

    delete update['childMenus'];

    this.isParentMenu(update);

    return await this.menusRepository.save(update);
  }

  private isParentMenu(dto: CreateMenusDto | UpdateMenusDto) {
    if (dto.parentId) {
      // 자식 메뉴는 link가 있어야 하며, icon은 없어야 함
      if (!dto.link || dto.icon) throw new BadRequestException(ExceptionMessages.NO_PARAMETER);
    } else {
      // 부모 메뉴는 link가 없어야 하며, icon이 있어야함
      if (dto.link || dto.icon === undefined || dto.icon === null)
        throw new BadRequestException(ExceptionMessages.NO_PARAMETER);
    }
  }

  async deleteMenus(id: number, all: boolean) {
    const menus = await this.menusRepository.findOne({
      where: { id },
      relations: {
        childMenus: true,
      },
    });

    if (!menus) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID);

    const childMenus = menus.childMenus;

    let affected = 0;

    if (childMenus.length > 0) {
      if (!all) {
        throw new BadRequestException(ExceptionMessages.HAS_CHILD_MENUS);
      }

      const deleteChildMenus = await this.menusRepository.delete({
        id: Or(...childMenus.map((c) => Equal(c.id))),
      });

      affected = deleteChildMenus.affected;
    }

    const deleteMenus = await this.menusRepository.delete({ id: menus.id });

    return { ...deleteMenus, affected: deleteMenus.affected + affected };
  }

  async getAllMenus() {
    return await this.menusRepository.find({
      select: {
        id: true,
        name: true,
        icon: true,
        order: true,
        childMenus: {
          id: true,
          order: true,
          name: true,
          link: true,
          parentMenus: {},
        },
      },
      where: {
        parentMenus: IsNull(),
      },
      relations: {
        childMenus: {
          parentMenus: true,
        },
      },
      order: {
        order: 'ASC',
        childMenus: {
          order: 'ASC',
        },
      },
    });
  }

  async findMenus(page: MenuPaginationDto) {
    return this.commonService.paginate<MenusEntity>(page, this.menusRepository);
  }
}
