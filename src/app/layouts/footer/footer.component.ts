import { Component, Inject, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  constructor(
    @Inject('HOSPITALNAMEEN') public hospitalNameEn: string,
  ) { }

  ngOnInit() {
  }

}
