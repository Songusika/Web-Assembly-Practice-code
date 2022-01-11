#include <cstdlib>
#include <cstring>

//엠스크립튼 컴파일러로 컴파일시에만 사용하는 헤더파일
#ifdef __EMSCRIPTEN__
    #include <emscripten.h>  //런타임에는 사용하지 않는 헤더파일
#endif

#ifdef __cplusplus //c++ 파일이면 아래 구문 추가
extern "C"
{ //네임 맹글러를 적용하지 않음 (함수 오버로드시 컴파일 단계에서 이름을 바꾸는 것)
#endif

    int ValidateValueProvided(const char *value, const char *error_message, char *return_error_message)
    {
        //value가 null 혹은 공백 문자면 에러
        if ((value == NULL) || (value[0] == '\0'))
        {
            strcpy(return_error_message, error_message);
            return 0;
        }

        //에러 없음
        return 1;
    }

#ifdef __EMSCRIPTEN__
    EMSCRIPTEN_KEEPALIVE  //명령줄 플래그 EXPORTED_FUNCTION에 추가하지 않아도 됨.
#endif
    int ValidateName(char *name, int maximum_length, char *return_error_message)
    {
        if (ValidateValueProvided(name, "A Product Name must be provided.", return_error_message) == 0)
        {
            return 0;
        }

        if (strlen(name) > maximum_length)
        {
            strcpy(return_error_message, "The Product Name is too long.");
            return 0;
        }

        return 1;
    }

    int IsCategoryIdInArray(char *selected_category_id, int *valid_category_ids, int array_length)
    {
        int category_id = atoi(selected_category_id);
        for (int index = 0; index < array_length; index++)
        {
            if (valid_category_ids[index] == category_id)
            {
                return 1;
            }
        }
        return 0;
    }

#ifdef __EMSCRIPTEN__
    EMSCRIPTEN_KEEPALIVE
#endif
    int ValidateCategory(char *category_id, int *valid_category_ids, int array_length, char *return_error_message)
    {
        if (ValidateValueProvided(category_id, "A Product Category must be selected.", return_error_message) == 0)
        {
            return 0;
        }

        if ((valid_category_ids == NULL) || (array_length == 0))
        {
            strcpy(return_error_message, "There are no Product Categories available.");
            return 0;
        }

        if (IsCategoryIdInArray(category_id, valid_category_ids, array_length) == 0)
        {
            strcpy(return_error_message, "The selected Product Category is not valid.");
            return 0;
        }

        return 1;
    }

#ifdef __cplusplus
}
#endif