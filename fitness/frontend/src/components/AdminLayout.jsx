import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import './AdminLayout.css';

/**
 * Admin Layout Component
 * Provides sidebar navigation for admin pages
 * Menu items: Dashboard, Plans, Goals, Questions, Users, Audit
 */
function AdminLayout({ user, token }) {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <h2 className="admin-sidebar__title">Menu</h2>
        </div>
        <nav className="admin-sidebar__nav">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/plans"
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
          >
            Plans
          </NavLink>
          <NavLink
            to="/goals"
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
          >
            Goals
          </NavLink>
          <NavLink
            to="/admin/questions"
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
          >
            Questions
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
          >
            Users
          </NavLink>
          <NavLink
            to="/admin/audit"
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
            }
          >
            Audit
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
