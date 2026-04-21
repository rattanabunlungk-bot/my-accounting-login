// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbYqwByBWN2BDItbkhlqpssaFZVR6Wrxo",
  authDomain: "my-accounting-system-63c0a.firebaseapp.com",
  projectId: "my-accounting-system-63c0a",
  storageBucket: "my-accounting-system-63c0a.firebasestorage.app",
  messagingSenderId: "621610645669",
  appId: "1:621610645669:web:166172efe572e810b1754c",
  measurementId: "G-TCYMMP3QBD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Mock Database Initial Data
      const users = {
          "owner": { name: "คุณสมชาย (Owner)", role: "owner", dept: "all" },
          "secretary": { name: "คุณริน (Secretary)", role: "secretary", dept: "all" },
          "manager1": { name: "หัวหน้าฝ่ายบัญชี", role: "manager", dept: "accounting" },
          "staff1": { name: "ลูกน้องบัญชี", role: "staff", dept: "accounting" },
          "manager2": { name: "หัวหน้าฝ่ายภาษี", role: "manager", dept: "tax" },
          "staff2": { name: "ลูกน้องภาษี", role: "staff", dept: "tax" }
      };
    
     const initialTasks = [
         { id: 1, title: "ทำงบการเงิน Q1", status: "Pending", dept: "accounting" },
         { id: 2, title: "ยื่น ภ.พ.30", status: "Processing", dept: "tax" },
         { id: 3, title: "ตรวจสอบบิลรายจ่าย", status: "Completed", dept: "accounting" }
     ];
    
    // Local Storage Helper Functions
     function getDB(key, defaultVal) {
         const data = localStorage.getItem(key);
         return data ? JSON.parse(data) : defaultVal;
     }

     function saveDB(key, val) {
         localStorage.setItem(key, JSON.stringify(val));
     }
    
     // Authentication Logic
     if (document.getElementById('loginForm')) {
         document.getElementById('loginForm').addEventListener('submit', function(e) {
             e.preventDefault();
             const user = users[document.getElementById('username').value];
             if (user) {
                 sessionStorage.setItem('currentUser', JSON.stringify(user));
                 addLog(user, "Login", "เข้าสู่ระบบสำเร็จ");
                 window.location.href = 'dashboard.html';
             } else {
                 alert("ไม่พบชื่อผู้ใช้งานนี้!");
             }
         });
     }

 // Log System
 function addLog(user, action, details) {
     const logs = getDB('activity_logs', []);
     logs.unshift({
         time: new Date().toLocaleString(),
         user: user.name,
         role: user.role,
         dept: user.dept,
         action: action,
         details: details
     });
     saveDB('activity_logs', logs);
 }
 // Dashboard Logic
 function initDashboard() {
         const user = JSON.parse(sessionStorage.getItem('currentUser'));
         if (!user) { window.location.href = 'index.html'; return; }
    
         // แสดงชื่อผู้ใช้
         document.getElementById('welcomeText').innerText = `สวัสดี, ${user.name}`;
    
         // --- ส่วนที่แก้ไข: ดึงข้อมูลแบบ Real-time จาก Firebase ---
         db.collection('tasks').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTasks(tasks); // เมื่อมีคนเพิ่มงานใน Cloud ฟังก์ชันนี้จะทำงานเองอัตโนมัติ
        });
    }
    
     function renderTasks() {
         const user = JSON.parse(sessionStorage.getItem('currentUser'));
         const tasks = getDB('tasks', initialTasks);
         const grid = document.getElementById('taskGrid');
         grid.innerHTML = '';
    
         tasks.forEach(task => {
             // Role Filtering: Manager/Staff see only their dept
             if (user.dept !== 'all' && user.dept !== task.dept) return;
    
             const card = document.createElement('div');
             card.className = 'task-card';
             card.innerHTML = `
                 <span class="status-badge status-${task.status}">${task.status}</span>
                 <h3>${task.title}</h3>
                 <p>แผนก: ${task.dept === 'accounting' ? 'บัญชี' : 'ภาษี'}</p>
                 <select class="status-select" onchange="updateTask(${task.id}, this.value)">
                     <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${task.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Review" ${task.status === 'Review' ? 'selected' : ''}>Review</option>
                    <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            `;
             grid.appendChild(card);
         });
     }
    
     function updateTask(id, newStatus) {
         const user = JSON.parse(sessionStorage.getItem('currentUser'));
        const tasks = getDB('tasks', initialTasks);
        const taskIndex = tasks.findIndex(t => t.id === id);
   
        if (taskIndex !== -1) {
            const oldStatus = tasks[taskIndex].status;
            tasks[taskIndex].status = newStatus;
            saveDB('tasks', tasks);
            addLog(user, "Update Status", `เปลี่ยนงาน "${tasks[taskIndex].title}" จาก ${oldStatus} เป็น ${newStatus}`);
            renderTasks();
        }
    }

function showSection(section) {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    document.getElementById('tasksSection').style.display = section === 'tasks' ? 'block' : 'none';
       document.getElementById('logsSection').style.display = section === 'logs' ? 'block' : 'none';
  
        if (section === 'logs') loadLogs(user);
    }
   
    function loadLogs(viewer) {
        const allLogs = getDB('activity_logs', []);
        const tableBody = document.getElementById('logTableBody');
        tableBody.innerHTML = '';
        allLogs.forEach(log => {
            let show = false;
            if (viewer.role === 'owner' || viewer.role === 'secretary') {
                show = true; // See everything
            } else if (viewer.role === 'manager' && log.dept === viewer.dept) {
                show = true; // Manager sees logs from their department
            }
            if (show) {
                const row = `<tr>
                    <td>${log.time}</td>
                    <td>${log.user}</td>
                    <td>${log.action}</td>
                    <td>${log.details}</td>
                </tr>`;
                tableBody.innerHTML += row;
            }
        });
    }
   
    function logout() {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
