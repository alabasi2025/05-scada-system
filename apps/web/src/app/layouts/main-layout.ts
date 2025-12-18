import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { WebSocketService, AlarmsService } from '../core/services';
import { Subscription } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <!-- Sidebar -->
      <aside class="fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300"
             [class.translate-x-full]="!sidebarOpen()"
             [class.translate-x-0]="sidebarOpen()">
        <div class="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
          <h1 class="text-xl font-bold text-primary-600 dark:text-primary-400">نظام SCADA</h1>
          <button (click)="toggleSidebar()" class="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <nav class="mt-4 px-2">
          @for (item of navItems; track item.route) {
            <a [routerLink]="item.route"
               routerLinkActive="bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
               class="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span [innerHTML]="item.icon"></span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Connection Status -->
        <div class="absolute bottom-4 left-4 right-4">
          <div class="flex items-center gap-2 px-4 py-2 rounded-lg"
               [class.bg-green-100]="wsService.isConnected()"
               [class.bg-red-100]="!wsService.isConnected()">
            <span class="w-2 h-2 rounded-full"
                  [class.bg-green-500]="wsService.isConnected()"
                  [class.bg-red-500]="!wsService.isConnected()"></span>
            <span class="text-sm" [class.text-green-700]="wsService.isConnected()" [class.text-red-700]="!wsService.isConnected()">
              {{ wsService.isConnected() ? 'متصل' : 'غير متصل' }}
            </span>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="lg:mr-64">
        <!-- Header -->
        <header class="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow">
          <div class="flex items-center justify-between h-16 px-4">
            <button (click)="toggleSidebar()" class="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <div class="flex items-center gap-4">
              <!-- Alarms Badge -->
              <button class="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" routerLink="/alarms">
                <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                @if (activeAlarmsCount() > 0) {
                  <span class="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
                    {{ activeAlarmsCount() > 99 ? '99+' : activeAlarmsCount() }}
                  </span>
                }
              </button>

              <!-- Time -->
              <div class="text-sm text-gray-600 dark:text-gray-300">
                {{ currentTime() }}
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="p-4 lg:p-6">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Mobile Overlay -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" (click)="toggleSidebar()"></div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  wsService = inject(WebSocketService);
  private alarmsService = inject(AlarmsService);
  
  sidebarOpen = signal(true);
  activeAlarmsCount = signal(0);
  currentTime = signal('');
  
  private timeInterval?: ReturnType<typeof setInterval>;
  private subscription = new Subscription();

  navItems: NavItem[] = [
    { label: 'لوحة التحكم', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>', route: '/dashboard' },
    { label: 'الخريطة', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>', route: '/map' },
    { label: 'الرسوم البيانية', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>', route: '/charts' },
    { label: 'المحطات', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>', route: '/stations' },
    { label: 'الأجهزة', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>', route: '/devices' },
    { label: 'التنبيهات', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>', route: '/alarms' },
    { label: 'أوامر التحكم', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>', route: '/commands' },
    { label: 'التقارير', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>', route: '/reports' },
  ];

  ngOnInit(): void {
    this.wsService.connect();
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    this.loadActiveAlarms();
    
    // Subscribe to alarm updates
    this.subscription.add(
      this.wsService.alarms$.subscribe(msg => {
        if (msg.type === 'new') {
          this.activeAlarmsCount.update(count => count + 1);
        } else if (msg.type === 'cleared') {
          this.activeAlarmsCount.update(count => Math.max(0, count - 1));
        }
      })
    );

    this.wsService.subscribeToAlarms();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    this.subscription.unsubscribe();
    this.wsService.disconnect();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }));
  }

  private loadActiveAlarms(): void {
    this.alarmsService.getActive().subscribe({
      next: (alarms) => this.activeAlarmsCount.set(alarms.length),
      error: (err) => console.error('Failed to load alarms:', err)
    });
  }
}
