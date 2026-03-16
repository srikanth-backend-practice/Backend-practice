// let student = {
//     name: "Ram",
//     age: 20,
//     major: "Computer Science"
// };
// function Sum(a, b) {
//     return a + b;
// }   
// console.log("Student Name: " + student.name);
// console.log("Sum: " + Sum(5, 10));
// let diff = function(a, b) {
//     return a - b;
// };
// console.log("Difference: " + diff(10, 5));
// let mult = (a, b) => a * b;
// console.log("Multiplication: " + mult(5, 10));

// function datafetch() {
//     return new Promise((resolve, reject) => {
//     // Simulate a data fetch
//     setTimeout(() => {
//         console.log("Data fetched");
//         reject();
//     }, 1000);
// });     
// }
// datafetch().then(() => {
//     console.log("Data processing complete");
// })
// .catch((error) => {
//     console.error("Error occurred:", error);
// });
// destructuring
const student = {
    name: "John",
    age: 22,
    major: "Mathematics"
};
const { name, age, major } = student;
console.log("Name:", name);
console.log("Age:", age);
console.log("Major:", major);
console.log("Student Information:", student);

const employee = ["Ram", 30, "HR"];
const [empName, empAge, empDept] = employee;
console.log("Employee Name:", empName);
console.log("Employee Age:", empAge);
console.log("Employee Department:", empDept);