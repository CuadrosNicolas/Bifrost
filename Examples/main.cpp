#include <iostream>
using namespace std;

int fib(int n)
{
	if(n==0 || n==1)
		return 1;
	else
		return fib(n-1)+fib(n-2);

}

int main(int argc,char* argv[])
{
	int max = 0;
	cout << "%:title 1" << endl;
	cout << "Fibonacci values : " << endl;
	cout << "Computes the fibonacci function."<<endl;
	cout << "Choose the argument."<<endl;
	cout << "%:combobox 10 11 12 13 14" << endl;
	cout << "Maximun n : " << endl;
	cin >> max;
	cout << "%:table ," << endl;
	cout << "N,Value"<<endl;
	for (int i = 0; i < max; i++)
	{
		int out = fib(i);
		cout <<i<<","<<out<<"\n";
	}
	cout << "%:end" << endl;
	return 0;
}