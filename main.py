import json


class ExpenseTracker:

    # -------------------------------
    # 1. Initialize
    # -------------------------------

    def _init_(self):
        self.expenses = []


    # -------------------------------
    # 2. Save Expenses
    # -------------------------------

    def save_expenses(self):

        with open("expenses.json", "w") as file:
            json.dump(self.expenses, file, indent=4)


    # -------------------------------
    # 3. Load Expenses
    # -------------------------------

    def load_expenses(self):

        try:

            with open("expenses.json", "r") as file:
                self.expenses = json.load(file)

        except FileNotFoundError:

            self.expenses = []
# -------------------------------
    # 4. Add Expense
    # -------------------------------

    def add_expense(self):

        name = input("Enter expense name: ")

        try:
            amount = float(input("Enter amount: "))

        except ValueError:
            print("Please enter a valid amount.")
            return

        category = input("Enter category: ")
        date = input("Enter date: ")

        expense = {
            "name": name,
            "amount": amount,
            "category": category,
            "date": date
        }

        self.expenses.append(expense)

        self.save_expenses()

        print("Expense added successfully!")


    # -------------------------------
    # 5. View Expenses
    # -------------------------------

    def view_expenses(self):

        if len(self.expenses) == 0:

            print("No expenses found.")

        else:

            print("\n===== ALL EXPENSES =====")

            for i, expense in enumerate(self.expenses, start=1):

                print(
                    i,
                    expense["name"],
                    "₹" + str(expense["amount"]),
                    expense["category"],
                    expense["date"]
                )


    # -------------------------------
    # 6. Search Expense
    # -------------------------------

    def search_expense(self):

        if len(self.expenses) == 0:

            print("No expenses found.")
            return

        search_category = input("Enter category to search: ")

        found = False

        for expense in self.expenses:

            if expense["category"].lower() == search_category.lower():

                print(
                    expense["name"],
                    "₹" + str(expense["amount"]),
                    expense["category"],
                    expense["date"]
                )

                found = True

        if found == False:

            print("No expenses found in this category.")


    # -------------------------------
    # 7. Edit Expense
    # -------------------------------

    def edit_expense(self):

        if len(self.expenses) == 0:

            print("No expenses found.")
            return

        try:

            expense_id = int(
                input("Enter expense ID to edit: ")
            )

        except ValueError:

            print("Please enter a valid ID.")
            return

        if expense_id < 1 or expense_id > len(self.expenses):

            print("Invalid expense ID.")

        else:

            expense = self.expenses[expense_id - 1]

            print("\nCurrent Expense:")

            print("Name:", expense["name"])
            print("Amount: ₹" + str(expense["amount"]))
            print("Category:", expense["category"])
            print("Date:", expense["date"])

            expense["name"] = input("Enter new name: ")

            try:

                expense["amount"] = float(
                    input("Enter new amount: ")
                )

            except ValueError:
                print("Invalid amount. Edit cancelled.")
                return

            expense["category"] = input(
                "Enter new category: "
            )

            expense["date"] = input(
                "Enter new date: "
            )

            self.save_expenses()

            print("Expense updated successfully!")


    # -------------------------------
    # 8. Delete Expense
    # -------------------------------

    def delete_expense(self):

        if len(self.expenses) == 0:

            print("No expenses found.")
            return

        try:

            expense_id = int(
                input("Enter expense ID to delete: ")
            )

        except ValueError:

            print("Please enter a valid ID.")
            return

        if expense_id < 1 or expense_id > len(self.expenses):

            print("Invalid expense ID.")

        else:

            deleted_expense = self.expenses.pop(
                expense_id - 1
            )

            self.save_expenses()

            print("\nDeleted Expense:")

            print("Name:", deleted_expense["name"])
            print(
                "Amount: ₹"
                + str(deleted_expense["amount"])
            )
            print(
                "Category:",
                deleted_expense["category"]
            )
            print(
                "Date:",
                deleted_expense["date"]
            )

            print("Expense deleted successfully!")


  
    # 9. Calculate Total
   

    def calculate_total(self):

        total = 0

        for expense in self.expenses:

            total = total + expense["amount"]

        print("\n===== TOTAL SPENDING =====")

        print("Total Expenses: ₹" + str(total))


    
    # 10. Category Summary
   

    def category_summary(self):

        if len(self.expenses) == 0:

            print("No expenses found.")
            return

        category_totals = {}

        for expense in self.expenses:

            category = expense["category"]
            amount = expense["amount"]

            if category in category_totals:

                category_totals[category] += amount

            else:

                category_totals[category] = amount

        print("\n===== CATEGORY SUMMARY =====")

        for category, total in category_totals.items():

            print(
                category
                + " : ₹"
                + str(total)
            )


    
    # 11. Main Menu

    def run(self):

        self.load_expenses()

        while True:

            print(
                "\n===== PERSONAL EXPENSE TRACKER ====="
            )

            print("1. Add Expense")
            print("2. View Expenses")
            print("3. Search Expense")
            print("4. Edit Expense")
            print("5. Delete Expense")
            print("6. Calculate Total")
            print("7. Category Summary")
            print("8. Exit")

            choice = input(
                "Enter your choice: "
            )

            if choice == "1":

                self.add_expense()

            elif choice == "2":

                self.view_expenses()

            elif choice == "3":

                self.search_expense()

            elif choice == "4":

                self.edit_expense()

            elif choice == "5":

                self.delete_expense()

            elif choice == "6":

                self.calculate_total()

            elif choice == "7":

                self.category_summary()

            elif choice == "8":

                print(
                    "Thank you for using "
                    "Personal Expense Tracker!"
                )

                break

            else:

                print(
                    "Invalid choice! "
                    "Please select 1 to 8."
                )

tracker = ExpenseTracker()

tracker.run()