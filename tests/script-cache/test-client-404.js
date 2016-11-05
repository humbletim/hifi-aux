print('BEFORE 404...');
Script.include('https://httpbin.org/status/404?'+new Date().getTime().toString(36))
// currently this line will never be hint
print('//AFTER 404');
// the client script will not be "stoppable" via Running Scripts... anymore either
