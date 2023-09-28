import { Component, OnInit, Input } from '@angular/core';
import { MainService } from 'src/app/services';

declare const $: any;
declare const ace: any;

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  @Input() decode: any;

  ngAfterViewInit(): void {
    $(document).ready(function () {
      try { ace.settings.loadState('sidebar') } catch (e) { }
    });
  }

  constructor(
    private main: MainService
  ) { }

  // ngAfterViewInit(): void {
  //   try { ace.settings.loadState('sidebar') } catch (e) { }
  //   // $('li').click(function () {
  //   //   $(this).toggleClass('open');
  //   //   $(this).css({ height: 0, overflow: 'hidden', display: 'block' })
  //   //     .removeClass('nav-hide').addClass('nav-show').parent().addClass('open');
  //   // });
  // }

  ngOnInit() {
  }

  public get authGuard2() {
    return this.main.authGuard2;
  }

  public get authGuard3() {
    return this.main.authGuard3;
  }

}
