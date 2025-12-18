import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">اختبار API</h1>
      <p>API URL: {{ apiUrl }}</p>
      <button (click)="testApi()" class="bg-blue-500 text-white px-4 py-2 rounded mb-4">اختبار</button>
      <div *ngIf="loading()">جاري التحميل...</div>
      <div *ngIf="error()" class="text-red-500">خطأ: {{ error() }}</div>
      <pre *ngIf="data()" class="bg-gray-100 p-4 rounded overflow-auto max-h-96">{{ data() | json }}</pre>
    </div>
  `,
})
export class TestComponent implements OnInit {
  private http = inject(HttpClient);
  apiUrl = environment.apiUrl;
  
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<any>(null);

  ngOnInit() {
    this.testApi();
  }

  testApi() {
    this.loading.set(true);
    this.error.set(null);
    
    const url = `${this.apiUrl}/v1/scada/stations`;
    console.log('Testing URL:', url);
    
    this.http.get(url).subscribe({
      next: (response) => {
        console.log('Response:', response);
        this.data.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.error.set(err.message || 'Unknown error');
        this.loading.set(false);
      }
    });
  }
}
