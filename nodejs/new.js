// import { CheckForUser, registerUser } from './Registration';
import fs from 'fs';


// function Fname(){
//     console.log("Hello, World!");
// }
// Fname();
// CheckForUser()
// registerUser()
// fs.writeFile('output.txt', 'This is a sample text file.', (err) => {
//   if (err){
//     console.error('Error writing file:', err);
//   }
//   console.log('File has been saved!');

// });
fs.readFile('output.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  console.log('File contents:', data);
});
