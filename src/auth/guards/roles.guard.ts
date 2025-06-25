import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // Pobieramy role wymagane dla danego endpointu (ustawione przez dekorator @Roles)
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Jeśli endpoint nie wymaga żadnych specyficznych ról, wpuszczamy każdego
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Pobieramy obiekt użytkownika z żądania (dołączony przez JwtAuthGuard)
        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            return false;
        }

        // Sprawdzamy, czy rola użytkownika znajduje się w tablicy wymaganych ról
        return requiredRoles.some((role) => user.role === role);
    }
}