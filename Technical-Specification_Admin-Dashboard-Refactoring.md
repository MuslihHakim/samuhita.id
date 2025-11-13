# **Technical Specification: Admin Dashboard Refactoring**

Author: Gemini AI  
Date: October 21, 2025  
Version: 1.0

## **1\. Overview**

The current Admin Dashboard (page.js) is a single, monolithic React component responsible for rendering the entire user interface, managing all application state, handling all user interactions, and fetching all data. This has led to performance bottlenecks, decreased maintainability, and a challenging development experience.

This document proposes a strategic plan to refactor the dashboard by breaking it down into smaller, reusable, and manageable components. We will adopt a component-based architecture, separate business logic from the UI, and optimize data handling.

### **1.1. Goals**

* **Improve Performance:** Reduce initial page load time and enhance UI responsiveness by breaking down the component and potentially lazy-loading parts of the UI.  
* **Enhance Maintainability:** Create a well-structured codebase with smaller, focused components that are easier to understand, debug, and modify.  
* **Increase Reusability:** Develop a library of components (e.g., modals, tables, filters) that can be reused elsewhere in the application.  
* **Improve Developer Experience:** A more organized and modular structure will make the development process faster and less error-prone.

### **1.2. Current Architecture Issues**

* **Single Massive Component:** Over 1500 lines of code in one file.  
* **Centralized State Management:** Numerous useState hooks make it difficult to track state changes and lead to unnecessary re-renders of the entire page.  
* **Mixed Concerns:** UI rendering, data fetching, state management, and utility functions are all intertwined.  
* **Poor Readability:** The sheer size and complexity of the file make it hard to navigate and understand the component's logic.

## **2\. Proposed Architecture: Component-Based Structure**

We will decompose the AdminDashboard page into a hierarchy of smaller, specialized components. The parent page will be responsible for layout and orchestrating data flow, while child components will handle specific UI sections and functionalities.

### **2.1. New File & Folder Structure**

To support this new architecture, we will organize the code into the following structure within a new features/admin or components/admin directory:

/app/admin/  
├── page.js               // The main page, now much leaner.  
├── components/  
│   ├── AdminHeader.js        // The top header with title and buttons.  
│   ├── StatsCards.js         // The grid of statistics cards.  
│   ├── SubmissionsTable.js   // The main data table component.  
│   ├── TableToolbar.js       // Filter controls and action buttons above the table.  
│   ├── TablePagination.js    // Pagination controls for the table.  
│   ├── BulkActionBar.js      // Bar that appears when items are selected.  
│   └── modals/  
│       ├── AddCandidateModal.js  
│       ├── BulkUploadModal.js  
│       └── CredentialsModal.js  
└── hooks/  
    ├── useSubmissions.js     // Custom hook for fetching and managing submission data.  
    ├── useFilters.js         // Custom hook for managing filter state.  
    └── useBulkActions.js     // Custom hook for handling bulk operations.

### **2.2. Component Breakdown**

Here is a detailed breakdown of the proposed components and their responsibilities:

| Component | Description & Responsibilities | How to Break It Down |
| :---- | :---- | :---- |
| page.js (Refactored) | The main entry point. It will be responsible for the overall layout and integrating the main components. It will use the useSubmissions and useFilters hooks to fetch and manage data, passing it down to child components. | Cut all the JSX for the header, stats cards, and table sections. Paste them into their new respective component files. Import these new components. Move all related state and logic into the new custom hooks (useSubmissions, useFilters). |
| AdminHeader.js | Displays the dashboard title, theme toggle, Sync Sheets button, and Logout button. It will receive the handleSyncSheets and handleLogout functions as props. | Copy the \<header\> element and its contents from the original file. Create handleSyncSheets and handleLogout functions in the main page.js (or a relevant hook) and pass them as props. |
| StatsCards.js | A presentational component that displays the three statistics cards (Total, Pending, Registered). It will receive the calculated counts as props from the parent. | Copy the \<div\> containing the grid of \<Card\> components. It will receive props like totalSubmissions, pendingCount, and registeredCount. |
| SubmissionsTable.js | The core component that renders the data table (both mobile and desktop views). It will manage the display logic for submissions but will receive the filtered data, selection state, and action handlers as props. | This is the largest piece. Move the entire \<Card\> that contains the table. It will receive submissions data, selectedSubmissions, handleSelect, action handlers (handleVerify, handleDelete, etc.), and pagination state as props. The mobile card view and desktop table view will be inside this component. |
| TableToolbar.js | Contains all the filter dropdowns (Status, Add By, Sent To), the date picker, the search input, and action buttons (Download CSV, Upload CSV, Add Candidate). It will interact with the useFilters hook via props passed from the main page. | Extract the section containing all the filter DropdownMenu, Popover (for date), and Input components. The state for these filters and the clearFilters function will be passed down as props. |
| TablePagination.js | Renders the pagination controls. It will receive the currentPage, totalPages, and setCurrentPage function as props. | Copy the \<div\> containing the pagination buttons and page count information. The logic remains simple and is controlled by props. |
| BulkActionBar.js | The bar that appears conditionally when one or more submissions are selected. It displays the selection count and bulk action buttons (Download, Delete). | Extract the conditional JSX that checks selectedSubmissions.size \> 0\. It will receive the selection set, clearSelection function, and handlers for bulk actions as props. |
| **Modal Components** | Each modal (AddCandidateModal, BulkUploadModal, CredentialsModal) will be a self-contained component. They will manage their own internal state (e.g., form data, upload progress) and be controlled by an isOpen prop. | For each \<Dialog\>, create a new component file. Move all related state (e.g., addCandidateModal, candidateFormData) and handler functions (handleAddCandidate) into the respective modal component. The open/close state will be controlled from the parent page. |

### **2.3. Logic & State Management with Custom Hooks**

Separating logic from UI is crucial. We will create custom hooks to handle data fetching, filtering, and business logic.

#### **useSubmissions.js**

* **Responsibility:** Fetching submissions, handling single-item actions (verify, generate account, delete), and managing the main submissions state and loading states.  
* **Exports:** submissions, loading, fetchSubmissions, handleVerify, handleGenerateAccount, handleDelete, etc.  
* **Implementation:** Move the fetchSubmissions useEffect and all related action handler functions (handleVerify, etc.) into this hook. It will encapsulate all API interactions.

#### **useFilters.js**

* **Responsibility:** Managing all filter-related state (statusFilter, dateFilter, searchQuery, etc.) and providing the logic to compute the filteredSubmissions.  
* **Exports:** filters, setFilters, filteredSubmissions, clearFilters.  
* **Implementation:** Move all filter-related useState hooks and the getFilteredSubmissions logic into this hook. It will take the raw submissions array as an argument and return the filtered result.

## **3\. Refactoring Steps**

1. **Create New File Structure:** Set up the folders and empty files as outlined in section 2.1.  
2. **Create Custom Hooks:**  
   * Start with useSubmissions.js. Move all data fetching and single-action logic from page.js into this new hook.  
   * Create useFilters.js and move all filter state and filtering logic into it.  
3. **Refactor page.js:**  
   * Delete the logic that was moved to the hooks.  
   * Call the new hooks: const { submissions, loading, ...actions } \= useSubmissions(); and const { filteredSubmissions, ... } \= useFilters(submissions);.  
   * Replace the large JSX blocks with the new, empty components (e.g., \<AdminHeader /\>, \<SubmissionsTable /\>).  
4. **Populate Child Components:**  
   * One by one, move the corresponding JSX from the original page.js into each new component file (AdminHeader.js, StatsCards.js, etc.).  
   * Define the necessary props for each component to receive data and handlers from the parent page.js.  
   * Refactor the modals into their own components, ensuring they manage their internal form state while their visibility is controlled by the parent.  
5. **Connect Props:** Wire everything together in page.js by passing the state and functions from the hooks down to the child components as props.  
6. **Test and Verify:** Thoroughly test the dashboard to ensure all functionalities—filtering, searching, pagination, modals, and all actions—work exactly as they did before the refactoring.

## **4\. Conclusion & Benefits**

By systematically breaking down the AdminDashboard component, we will transform a monolithic and unwieldy file into a clean, modular, and performant system.

This refactoring will immediately result in:

* **Faster Load Times:** The main page component will be much smaller. With techniques like React.lazy, we could even defer the loading of non-critical components like modals.  
* **Simplified Debugging:** When a bug occurs in the filter bar, we only need to look at the TableToolbar.js component and the useFilters.js hook, not search through 1500 lines of code.  
* **Scalability:** Adding a new feature, like another filter or a new bulk action, becomes a straightforward task of modifying a small, focused component or hook.

This investment in code quality and structure is a standard best practice that will pay significant dividends throughout the application's lifecycle.