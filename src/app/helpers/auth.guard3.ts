import { Injectable, Inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MainService } from '../services';

@Injectable({ providedIn: 'root' })
export class AuthGuard3 implements CanActivate {
    constructor(
        @Inject('DEFAULTPATH') private defaultPath: string,
        private router: Router,
        private main: MainService
    ) { }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        sessionStorage.setItem(this.defaultPath, state.url);
        if (!this.main.authGuard3) {
            this.router.navigate(['/home']);
            return false;
        } else {
            return true;
        }
    }
}
