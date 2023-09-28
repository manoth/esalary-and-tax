import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CryptoService } from 'src/app/services';

declare const $: any;

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {

  public signIn = new SignIn();

  public path: string;

  constructor(
    public route: ActivatedRoute,
    public crypto: CryptoService
  ) { }

  ngOnInit() {
    $('#username').focus();
    this.path = this.route.snapshot.url[0].path;
  }

  @Output() onSignIn: EventEmitter<any> = new EventEmitter();
  onSubmit() {
    (!this.signIn.username) ? $('#username').focus() : $('#password').focus();
    !(this.signIn.username && this.signIn.password) ||
      this.onSignIn.emit({ username: this.signIn.username, password: this.crypto.md5(this.signIn.password) });
  }

}

export class SignIn {
  username: string;
  password: string;
}
