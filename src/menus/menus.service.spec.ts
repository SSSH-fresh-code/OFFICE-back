import { MenusService } from './menus.service';
import { CreateMenusDto } from './dto/create-menus.dto';
import { MenusEntity } from './entities/menus.entity';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExceptionMessages } from 'src/common/message/exception.message';

describe('MenusService', () => {
  let service: MenusService;

  const mockCreateparentMenusDto: CreateMenusDto = {
    order: 1,
    name: "유저 메뉴",
    icon: "USERS",
  }
  const mockCreateparentMenusEntity: MenusEntity = {
    id: 1,
    auths: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    childMenus: [],
    ...mockCreateparentMenusDto
  }

  const mockCreateChildMenusDto: CreateMenusDto = {
    order: 2,
    name: "유저 생성하기",
    link: "/users/create",
    parentId: 1
  }
  const mockCreateChildMenusEntity: MenusEntity = {
    id: 2,
    auths: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    childMenus: [],
    ...mockCreateChildMenusDto
  }

  const mockRepository = () => ({
    create: jest.fn((v: CreateMenusDto) => {
      if (v.link) return mockCreateChildMenusEntity;
      else if (v.icon) return mockCreateparentMenusEntity;
    }),
    save: jest.fn((v: MenusEntity) => {
      if (v.link) return mockCreateChildMenusEntity;
      else if (v.icon) return mockCreateparentMenusEntity;
    }),
    findOne: jest.fn((v: MenusEntity) => mockCreateparentMenusEntity)
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MenusService,
        {
          provide: 'MENUS_REPOSITORY',
          useValue: mockRepository(),
        }
      ]
    })
      .compile();

    service = moduleRef.get(MenusService);
  });

  describe('메뉴 생성', () => {
    it('부모 메뉴 생성하기', async () => {
      const menus = await service.createMenus(mockCreateparentMenusDto);

      expect(menus).toBeDefined();
      expect(menus.link).toBeUndefined();
      expect(menus.icon).toBeDefined();
    })

    it('자식 메뉴 생성하기', async () => {
      const menus = await service.createMenus(mockCreateChildMenusDto);

      expect(menus).toBeDefined();
      expect(menus.link).toBeDefined();
      expect(menus.icon).toBeUndefined();
    })

    it('[에러케이스] 부모 메뉴인데 링크포함된 경우', async () => {
      try {
        await service.createMenus({ ...mockCreateparentMenusDto, link: "/user" });
        expect(true).toBeFalsy();
      } catch (e) {
        const error = e as BadRequestException;
        expect(error.message).toBe(ExceptionMessages.NO_PARAMETER);
      }
    })

    it('[에러케이스] 자식 메뉴인데 아이콘 포함된 경우', async () => {
      try {
        await service.createMenus({ ...mockCreateChildMenusDto, icon: "USERS" });
        expect(true).toBeFalsy();
      } catch (e) {
        const error = e as BadRequestException;
        expect(error.message).toBe(ExceptionMessages.NO_PARAMETER);
      }
    })
  });

});
