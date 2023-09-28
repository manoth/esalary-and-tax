import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MainService } from 'src/app/services';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Input() decode: any;
  @Output() editEmail: EventEmitter<any> = new EventEmitter();

  public menuAdmin: boolean = false;

  constructor(
    private main: MainService
  ) { }

  ngOnInit() {
    this.getSysAdmin();
  }

  onLogout() {
    this.main.logout();
  }

  onEditEmail() {
    this.editEmail.emit(null);
  }

  getSysAdmin() {
    this.main.get('profile/admin/1').then((res: any) => {
      this.menuAdmin = res.ok;
    });
  }

}
