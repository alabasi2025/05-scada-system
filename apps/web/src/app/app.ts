import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styles: [':host { display: block; min-height: 100vh; }'],
})
export class App {
  protected title = 'نظام SCADA لإدارة الكهرباء';
}
