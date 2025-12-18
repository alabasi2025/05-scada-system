import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { WebSocketService, AlarmsService } from '../core/services';
import { Subscription } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  category?: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-100">
      <!-- Sidebar -->
      <aside class="fixed inset-y-0 right-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out"
             [class.translate-x-full]="!sidebarOpen()"
             [class.translate-x-0]="sidebarOpen()">
        
        <!-- Logo Section -->
        <div class="h-20 flex items-center gap-4 px-6 border-b border-slate-700/50 bg-slate-900/50">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">SCADA</h1>
            <p class="text-xs text-slate-400 font-medium">نظام المراقبة والتحكم</p>
          </div>
          <button (click)="toggleSidebar()" class="lg:hidden mr-auto p-2 rounded-lg hover:bg-slate-700 text-slate-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          @for (item of navItems; track item.route) {
            @if (item.category) {
              <div class="pt-6 pb-2 first:pt-2">
                <p class="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{{ item.category }}</p>
              </div>
            }
            <a [routerLink]="item.route"
               routerLinkActive="active-nav-item"
               class="nav-item group">
              <div class="nav-icon" [innerHTML]="item.icon"></div>
              <span class="flex-1">{{ item.label }}</span>
              @if (item.label === 'التنبيهات' && activeAlarmsCount() > 0) {
                <span class="px-2.5 py-1 text-xs font-bold bg-red-500 text-white rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                  {{ activeAlarmsCount() > 99 ? '99+' : activeAlarmsCount() }}
                </span>
              }
            </a>
          }
        </nav>

        <!-- Connection Status -->
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur">
          <div class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
               [class.bg-emerald-500/10]="wsService.isConnected()"
               [class.bg-red-500/10]="!wsService.isConnected()">
            <div class="relative">
              <span class="w-3 h-3 rounded-full block"
                    [class.bg-emerald-500]="wsService.isConnected()"
                    [class.bg-red-500]="!wsService.isConnected()"></span>
              @if (wsService.isConnected()) {
                <span class="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
              }
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold" 
                 [class.text-emerald-400]="wsService.isConnected()"
                 [class.text-red-400]="!wsService.isConnected()">
                {{ wsService.isConnected() ? 'متصل بالخادم' : 'غير متصل' }}
              </p>
              <p class="text-xs text-slate-500">{{ wsService.isConnected() ? 'البيانات محدثة' : 'جاري إعادة الاتصال...' }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="lg:mr-72 min-h-screen">
        <!-- Header -->
        <header class="sticky top-0 z-40 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div class="h-full flex items-center justify-between px-6">
            <!-- Left: Menu Button & Breadcrumb -->
            <div class="flex items-center gap-4">
              <button (click)="toggleSidebar()" class="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
              <div class="hidden sm:block">
                <h2 class="text-lg font-bold text-slate-800">مرحباً بك في نظام SCADA</h2>
                <p class="text-sm text-slate-500">إدارة ومراقبة شبكة الكهرباء</p>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-3">
              <!-- Search -->
              <button class="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors hidden sm:flex">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>

              <!-- Notifications -->
              <button class="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors" routerLink="/alarms">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                @if (activeAlarmsCount() > 0) {
                  <span class="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white">
                    {{ activeAlarmsCount() > 9 ? '9+' : activeAlarmsCount() }}
                  </span>
                }
              </button>

              <!-- Divider -->
              <div class="w-px h-8 bg-slate-200"></div>

              <!-- Time Display -->
              <div class="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm font-semibold text-slate-700 tabular-nums">{{ currentTime() }}</span>
              </div>

              <!-- User Avatar -->
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform">
                م
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="p-6">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Mobile Overlay -->
      @if (sidebarOpen()) {
        <div class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" (click)="toggleSidebar()"></div>
      }
    </div>
  `,
  styles: [`
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .nav-item:hover {
      background: rgba(59, 130, 246, 0.1);
      color: #e2e8f0;
    }
    
    .nav-item.active-nav-item {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%);
      color: #60a5fa;
      border-right: 3px solid #3b82f6;
      margin-right: -1px;
    }
    
    .nav-icon {
      width: 2.25rem;
      height: 2.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.625rem;
      background: rgba(148, 163, 184, 0.1);
      transition: all 0.2s ease;
    }
    
    .nav-icon :deep(svg) {
      width: 1.25rem;
      height: 1.25rem;
    }
    
    .nav-item:hover .nav-icon {
      background: rgba(59, 130, 246, 0.2);
    }
    
    .nav-item.active-nav-item .nav-icon {
      background: rgba(59, 130, 246, 0.3);
      color: #60a5fa;
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
    { label: 'لوحة التحكم', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>', route: '/dashboard' },
    { label: 'الخريطة', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>', route: '/map' },
    { label: 'الرسوم البيانية', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>', route: '/charts' },
    { label: 'المحطات', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>', route: '/stations', category: 'إدارة الأصول' },
    { label: 'الأجهزة', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>', route: '/devices' },
    { label: 'التنبيهات', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>', route: '/alarms', category: 'المراقبة والتحكم' },
    { label: 'أوامر التحكم', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>', route: '/commands' },
    { label: 'التقارير', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>', route: '/reports', category: 'التقارير' },
  ];

  ngOnInit(): void {
    this.wsService.connect();
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    this.loadActiveAlarms();
    
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
