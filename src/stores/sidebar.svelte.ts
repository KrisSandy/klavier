// Sidebar open/close state for mobile drawer

class SidebarStore {
  open = $state(false);

  toggle() {
    this.open = !this.open;
  }

  close() {
    this.open = false;
  }
}

export const sidebar = new SidebarStore();
