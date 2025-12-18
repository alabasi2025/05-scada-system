import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MenubarModule],
  template: `
    <div class="min-h-screen bg-slate-100">
      <!-- Header -->
      <header class="bg-gradient-to-l from-blue-700 to-blue-900 text-white shadow-lg">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <i class="pi pi-bolt text-2xl text-yellow-400"></i>
              <h1 class="text-xl font-bold">نظام المراقبة والتحكم SCADA</h1>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm opacity-80">{{ currentDate }}</span>
              <i class="pi pi-user text-lg"></i>
            </div>
          </div>
        </div>
      </header>

      <!-- Navigation -->
      <nav class="bg-white shadow-sm border-b">
        <div class="container mx-auto px-4">
          <div class="flex items-center gap-1 py-2 overflow-x-auto">
            <a *ngFor="let item of menuItems" 
               [routerLink]="item.routerLink" 
               routerLinkActive="bg-blue-100 text-blue-700"
               class="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap">
              <i [class]="item.icon"></i>
              <span>{{ item.label }}</span>
            </a>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="container mx-auto px-4 py-6">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t py-4 mt-auto">
        <div class="container mx-auto px-4 text-center text-slate-500 text-sm">
          نظام المراقبة والتحكم SCADA - جميع الحقوق محفوظة © 2025
        </div>
      </footer>
    </div>
  `,
})
export class MainLayoutComponent {
  currentDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  menuItems: MenuItem[] = [
    { label: 'لوحة التحكم', icon: 'pi pi-home', routerLink: '/dashboard' },
    { label: 'المحطات', icon: 'pi pi-building', routerLink: '/stations' },
    { label: 'الأجهزة', icon: 'pi pi-server', routerLink: '/devices' },
    { label: 'التنبيهات', icon: 'pi pi-bell', routerLink: '/alerts' },
    { label: 'الأوامر', icon: 'pi pi-cog', routerLink: '/commands' },
    { label: 'الخريطة', icon: 'pi pi-map', routerLink: '/map' },
    { label: 'التقارير', icon: 'pi pi-chart-bar', routerLink: '/reports' },
    { label: 'جودة الطاقة', icon: 'pi pi-gauge', routerLink: '/quality' },
    { label: 'الاستهلاك', icon: 'pi pi-bolt', routerLink: '/energy' },
    { label: 'الأمان', icon: 'pi pi-shield', routerLink: '/security' },
  ];
}
