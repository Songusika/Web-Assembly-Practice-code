#include <cstdlib>
#include <cstdint> // for the uint8_t data type
#include <cstring>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#ifdef __cplusplus
extern "C"
{ //네임 맹글링을 하지 않음
#endif

    // 함수 시그니처 선언
    typedef void (*OnSuccess)(void);
    typedef void (*OnError)(const char *);

    // 필요한 사이즈 만큼 버퍼 할당 함수
#ifdef __EMSCRIPTEN__
    EMSCRIPTEN_KEEPALIVE
#endif
    uint8_t *create_buffer(int size_needed)
    {
        return new uint8_t[size_needed];
    }

    // 할당한 버퍼를 delete
#ifdef __EMSCRIPTEN__
    EMSCRIPTEN_KEEPALIVE
#endif
    void free_buffer(const char *pointer)
    {
        delete pointer;
    }

    int ValidateValueProvided(const char *value)
    {
        // 전달받은 문자열을 검증하는 함수(Null or 공백문자로 시작할 경우)
        if ((value == NULL) || (value[0] == '\0'))
        {
            return 0;
        }

        // Everything is ok
        return 1;
    }

#ifdef __EMSCRIPTEN__
    EMSCRIPTEN_KEEPALIVE
#endif
    void ValidateName(char *name, int maximum_length, OnSuccess UpdateHostOnSuccess, OnError UpdateHostOnError)
    {
        // 상품명 검증하는 함수
        if (ValidateValueProvided(name) == 0) //전달받은 상품명이 옳바르지 않을 경우
        {
            UpdateHostOnError("A Product Name must be provided.");
        }
        // 상품명이 너무 길 경우
        else if (strlen(name) > maximum_length)
        {
            UpdateHostOnError("The Product Name is too long.");
        }
        else // 
        {
            UpdateHostOnSuccess();
        }
    }

    int IsCategoryIdInArray(char *selected_category_id, int *valid_category_ids, int array_length)
    {
        //카테고리 확인
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
    void ValidateCategory(char *category_id, int *valid_category_ids, int array_length, OnSuccess UpdateHostOnSuccess, OnError UpdateHostOnError) //카테고리 검증 함수
    {
        
        if (ValidateValueProvided(category_id) == 0)
        {
            UpdateHostOnError("A Product Category must be selected.");
        }
      
        else if ((valid_category_ids == NULL) || (array_length == 0))
        {
            UpdateHostOnError("There are no Product Categories available.");
        }
       
        else if (IsCategoryIdInArray(category_id, valid_category_ids, array_length) == 0)
        {
            UpdateHostOnError("The selected Product Category is not valid.");
        }
        else 
        {
            UpdateHostOnSuccess();
        }
    }

#ifdef __cplusplus
}
#endif