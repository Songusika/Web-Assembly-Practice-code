#include <stdio.h>
#include <stdlib.h>
#include <emscripten.h> //엠스크립튼 라이브러리

int IsPrime(int value){ //소수 계산 함수
    if (value == 2)
    {
        return 1;
    } //2는 소수
    if (value <= 1 || value % 2 == 0)
    {
        return 0;
    } //1 이하, 2를 제외한 짝수는 소수가 아니다.

    for (int i = 3; (i * i) <= value; i += 2)
    { //3부터 제곱근 까지, 루프를 반복, 홀수만 체크
        if (value % i == 0)
        {
            return 0;
        } //i로 나누어 떨어지면 소수가 아니다.
    }
    return 1; //어떤 값으로도 나누어 떨어지지 않음 = 소수
}

int main()
{ //스타트 함수
    int start = 3;
    int end = 100000;

    printf("Prime numbers between %d and %d:\n", start, end);
    for (int i = start; i <= end; i++)
    {
        if (IsPrime(i))
        {
            printf("%d ", i); //소수 부분을 웹브라우저 콘솔창에 출력
        }
    }
    printf("\n");

    return 0;
}
