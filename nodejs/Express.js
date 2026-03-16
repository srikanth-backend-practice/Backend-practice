const apps=require('express')
const app=apps()

app.get('/', (req, res) => {
    console.log(res);
    
  res.send('Hello, World!');
});
app.post("/register", (req, res) => {
    console.log(req.body);
    res.send('User registered successfully!');
});
app.put("/update", (req, res) => {
    console.log(req.body);
    res.send('User updated successfully!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
app.delete("/delete", (req, res) => {
    console.log(req.body);
    res.send('User deleted successfully!');
});